import fs from 'fs';
import path from 'path';
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Function to recursively read all markdown files from a directory
function readMarkdownFiles(dirPath: string, baseDir: string = dirPath): Array<{ content: string; relativePath: string; fullPath: string }> {
    const files: Array<{ content: string; relativePath: string; fullPath: string }> = [];
    
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
                // Recursively read subdirectories
                files.push(...readMarkdownFiles(fullPath, baseDir));
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
                // Read markdown file
                const content = fs.readFileSync(fullPath, 'utf-8');
                const relativePath = path.relative(baseDir, fullPath);
                files.push({
                    content,
                    relativePath,
                    fullPath
                });
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
    }
    
    return files;
}

// Function to extract category from file path
function extractCategory(filePath: string): string {
    const parts = filePath.split(path.sep);
    if (parts.length > 1) {
        return parts[0]; // First directory (concepts, guides, etc.)
    }
    return 'General';
}

// Function to extract title from markdown content
function extractTitle(content: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : 'Untitled';
}

async function ingestSuiDocs() {
    try {
        // Path to sui-docs directory (relative to the app directory)
        const suiDocsPath = path.join(process.cwd(), 'src', 'scripts', 'sui-docs');
        
        console.log(`Reading Sui documentation from: ${suiDocsPath}`);
        
        // Check if the directory exists
        if (!fs.existsSync(suiDocsPath)) {
            throw new Error(`Sui docs directory not found at: ${suiDocsPath}`);
        }
        
        // Read all markdown files recursively
        const markdownFiles = readMarkdownFiles(suiDocsPath);
        console.log(`Found ${markdownFiles.length} markdown files`);
        
        if (markdownFiles.length === 0) {
            throw new Error('No markdown files found in the sui-docs directory');
        }
        
        // Initialize Supabase client
        const privateKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!privateKey) throw new Error(`Expected env var SUPABASE_SERVICE_ROLE_KEY`);
        const url = process.env.SUPABASE_URL;
        if (!url) throw new Error(`Expected env var SUPABASE_URL`);
        
        const client = createClient(url, privateKey);

        // Create text splitter with optimized settings for technical documentation
        const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
            chunkSize: 4000,  // Much larger chunks for technical content
            chunkOverlap: 400, // Overlap to maintain context
            separators: [
                "\n## ", // Major sections
                "\n### ", // Subsections
                "\n#### ", // Sub-subsections
                "\n\n", // Paragraphs
                "\n", // Lines
                " ", // Words
            ]
        });

        console.log('Processing and splitting documents...');
        const allDocuments: Document[] = [];

        for (const file of markdownFiles) {
            const chunks = await splitter.splitText(file.content);
            const title = extractTitle(file.content);
            const category = extractCategory(file.relativePath);
            
            // Create documents with metadata for each chunk
            const documents = chunks.map((chunk: string) => {
                // Extract section headers for metadata
                const sectionMatch = chunk.match(/^#+\s+(.+)$/m);
                
                return new Document({
                    pageContent: chunk,
                    metadata: {
                        source: file.relativePath,
                        title: title,
                        category: category,
                        section: sectionMatch ? sectionMatch[1] : title,
                        filePath: file.fullPath,
                        type: 'sui-documentation'
                    }
                });
            });
            
            allDocuments.push(...documents);
            console.log(`Processed ${file.relativePath}: ${documents.length} chunks`);
        }

        console.log(`Created ${allDocuments.length} document chunks total`);

        // Clear existing documents (optional - remove if you want to append)
        console.log('Clearing existing documents...');
        await client.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Process documents in batches to avoid OpenAI token limits
        console.log('Creating embeddings and storing in Supabase...');
        const batchSize = 100; // Process 100 documents at a time
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        let totalProcessed = 0;
        for (let i = 0; i < allDocuments.length; i += batchSize) {
            const batch = allDocuments.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allDocuments.length / batchSize)} (${batch.length} documents)`);
            
            try {
                const vectorstore = await SupabaseVectorStore.fromDocuments(
                    batch,
                    embeddings,
                    {
                        client,
                        tableName: "documents",
                        queryName: "match_documents",
                    }
                );
                totalProcessed += batch.length;
                console.log(`Successfully processed ${totalProcessed}/${allDocuments.length} documents`);
            } catch (batchError) {
                console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, batchError);
                // Continue with next batch instead of failing completely
            }
        }

        console.log('Sui documentation ingestion completed successfully!');
        console.log(`Processed ${markdownFiles.length} files`);
        console.log(`Created ${allDocuments.length} document chunks`);
        console.log(`Categories: ${Array.from(new Set(allDocuments.map(doc => doc.metadata.category))).join(', ')}`);
        
    } catch (error) {
        console.error('Failed to ingest Sui documentation:', error);
        process.exit(1);
    }
}

// Run the ingestion
ingestSuiDocs(); 