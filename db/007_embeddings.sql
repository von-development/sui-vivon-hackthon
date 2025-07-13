-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing table if it exists (optional, only if you want to start fresh)
DROP TABLE IF EXISTS documents;

-- Create the documents table with proper structure
CREATE TABLE documents (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    content text NOT NULL,
    metadata jsonb,
    embedding vector (1536)
);

-- Create index for better performance
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow service role to access everything
CREATE POLICY "Enable all access for service role" ON documents FOR ALL TO service_role USING (true)
WITH
    CHECK (true);

-- Create the match_documents function
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.78,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        documents.id,
        documents.content,
        documents.metadata,
        1 - (documents.embedding <=> query_embedding) AS similarity
    FROM documents
    WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
    ORDER BY documents.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON documents TO service_role;

GRANT EXECUTE ON FUNCTION match_documents TO service_role;