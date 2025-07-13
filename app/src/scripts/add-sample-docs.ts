import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';

// Sample Sui blockchain documentation
const sampleSuiDocs = [
  {
    pageContent: `Sui is a layer-1 blockchain designed to make digital asset ownership fast, private, secure, and accessible to everyone. Sui uses the Move programming language, which is designed for safe and secure smart contract development.`,
    metadata: { source: 'sui_docs', type: 'overview' }
  },
  {
    pageContent: `Move is a programming language for writing safe smart contracts. It was originally developed for the Diem blockchain and is now used by Sui. Move uses a resource-oriented programming model with linear types.`,
    metadata: { source: 'sui_docs', type: 'move_language' }
  },
  {
    pageContent: `Sui objects are the basic units of storage in Sui. Every object has a globally unique ID, a version number, and a digest. Objects can be owned by addresses, other objects, or shared.`,
    metadata: { source: 'sui_docs', type: 'objects' }
  },
  {
    pageContent: `To create a new Move package, use the sui move new command. This creates a new directory with the basic structure needed for a Move package including Move.toml and sources directory.`,
    metadata: { source: 'sui_docs', type: 'development' }
  }
];

// Sample VIVON platform documentation
const sampleVivonDocs = [
  {
    pageContent: `VIVON is a Web3 bounty and challenge platform built on the Sui blockchain. It allows developers to create bounties, participate in challenges, and earn VIVON tokens and NFTs as rewards.`,
    metadata: { source: 'vivon_docs', type: 'overview' }
  },
  {
    pageContent: `To create a bounty on VIVON, connect your Sui wallet, navigate to the bounties section, and click "Create Bounty". You'll need to specify the requirements, reward amount, and deadline.`,
    metadata: { source: 'vivon_docs', type: 'bounty_creation' }
  },
  {
    pageContent: `VIVON tokens are the native utility tokens of the VIVON platform. They are used for bounty rewards, challenge prizes, and governance participation. Tokens are distributed through completed bounties and challenges.`,
    metadata: { source: 'vivon_docs', type: 'tokenomics' }
  },
  {
    pageContent: `VIVON NFTs are achievement badges and rewards given for completing challenges and bounties. They represent proof of skill and contribution to the VIVON ecosystem.`,
    metadata: { source: 'vivon_docs', type: 'nfts' }
  }
];

export async function addSampleDocuments() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const client = createClient(supabaseUrl, supabaseKey);
  
  const vectorStore = new SupabaseVectorStore(new OpenAIEmbeddings(), {
    client,
    tableName: "documents",
    queryName: "match_documents",
  });

  console.log('Adding sample Sui documentation...');
  await vectorStore.addDocuments(sampleSuiDocs);
  
  console.log('Adding sample VIVON documentation...');
  await vectorStore.addDocuments(sampleVivonDocs);
  
  console.log('✅ Sample documents added successfully!');
}

// Run the script if called directly
if (require.main === module) {
  addSampleDocuments().catch(console.error);
} 