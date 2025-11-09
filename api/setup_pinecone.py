#!/usr/bin/env python3
"""
Setup script to initialize Pinecone index for Axion Health
"""
import os
from dotenv import load_dotenv
from pinecone import Pinecone

# Load environment variables
load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "axion-health-journal"

if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY environment variable not set")

print(f"🚀 Setting up Pinecone index: {INDEX_NAME}")
print(f"📍 API Key: {PINECONE_API_KEY[:20]}...")

# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

# Check if index already exists
existing_indexes = pc.list_indexes()
index_names = [idx.name for idx in existing_indexes.indexes]

if INDEX_NAME in index_names:
    print(f"✅ Index '{INDEX_NAME}' already exists")
    index = pc.Index(INDEX_NAME)
    stats = index.describe_index_stats()
    print(f"   - Dimensions: {stats.dimension}")
    print(f"   - Total vectors: {stats.total_vector_count}")
    print(f"   - Namespaces: {list(stats.namespaces.keys())}")
else:
    print(f"📝 Creating index '{INDEX_NAME}'...")
    pc.create_index(
        name=INDEX_NAME,
        dimension=768,  # Gemini Embedding 001
        metric="cosine",
        spec={
            "serverless": {
                "cloud": "aws",
                "region": "us-east-1"
            }
        }
    )
    print(f"✅ Index created successfully!")

print("\n✨ Pinecone setup complete!")
print(f"\nYou can now use this index in your application:")
print(f"  - Index name: {INDEX_NAME}")
print(f"  - Dimensions: 768")
print(f"  - Metric: cosine")
