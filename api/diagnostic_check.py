"""
Diagnostic script to check if data exists in Supabase
Run this to verify that health_metrics and journal_entries have data
"""
from services.supabase_client import get_supabase_client
from datetime import datetime, timedelta
import sys

def check_health_metrics(user_id: str):
    """Check if health_metrics table has data for the user"""
    print("\n" + "="*60)
    print("CHECKING HEALTH METRICS")
    print("="*60)
    
    try:
        supabase = get_supabase_client()
        
        # Check total count
        result = supabase.table("health_metrics").select(
            "timestamp, metric_type, value", count="exact"
        ).eq("user_id", user_id).execute()
        
        total_count = result.count if hasattr(result, 'count') else len(result.data or [])
        print(f"✓ Total health_metrics records: {total_count}")
        
        if total_count == 0:
            print("⚠️  WARNING: No health metrics found!")
            print("   - Dashboard may not have loaded Sahha data yet")
            print("   - Try visiting the dashboard to trigger data fetch")
            return False
        
        # Check date range
        data = result.data or []
        if data:
            timestamps = [row['timestamp'] for row in data if row.get('timestamp')]
            if timestamps:
                timestamps.sort()
                print(f"✓ Date range: {timestamps[0]} to {timestamps[-1]}")
                
                # Check if data is recent
                try:
                    latest = datetime.fromisoformat(timestamps[-1].replace('Z', '+00:00'))
                    days_old = (datetime.now(latest.tzinfo) - latest).days
                    print(f"✓ Most recent data: {days_old} days old")
                    
                    if days_old > 7:
                        print("⚠️  WARNING: Data is more than 7 days old!")
                except:
                    pass
        
        # Check metric types
        type_result = supabase.table("health_metrics").select(
            "metric_type", count="exact"
        ).eq("user_id", user_id).execute()
        
        metric_types = {}
        for row in (type_result.data or []):
            mt = row.get('metric_type', 'unknown')
            metric_types[mt] = metric_types.get(mt, 0) + 1
        
        print(f"\n✓ Metric types found ({len(metric_types)}):")
        for metric_type, count in sorted(metric_types.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"   - {metric_type}: {count} records")
        
        # Check for critical metrics needed for forecasting
        critical_metrics = ['heart_rate_resting', 'steps', 'sleep_duration']
        print(f"\n✓ Critical metrics for forecasting:")
        for metric in critical_metrics:
            count = metric_types.get(metric, 0)
            status = "✓" if count >= 14 else "⚠️ "
            print(f"   {status} {metric}: {count} records (need 14 for forecast)")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR checking health_metrics: {e}")
        if "does not exist" in str(e).lower():
            print("   - health_metrics table doesn't exist!")
            print("   - Run: api/schema/health_metrics.sql in Supabase")
        return False


def check_journal_entries(user_id: str):
    """Check if journal_entries table has data for the user"""
    print("\n" + "="*60)
    print("CHECKING JOURNAL ENTRIES")
    print("="*60)
    
    try:
        supabase = get_supabase_client()
        
        # Check total count
        result = supabase.table("journal_entries").select(
            "id, date, content", count="exact"
        ).eq("user_id", user_id).execute()
        
        total_count = result.count if hasattr(result, 'count') else len(result.data or [])
        print(f"✓ Total journal entries: {total_count}")
        
        if total_count == 0:
            print("⚠️  WARNING: No journal entries found!")
            print("   - User hasn't created any journal entries yet")
            print("   - Create a test entry in the app")
            return False
        
        # Show samples
        data = result.data or []
        if data:
            print(f"\n✓ Sample entries:")
            for i, entry in enumerate(data[:3], 1):
                content_preview = entry.get('content', '')[:60]
                print(f"   {i}. {entry.get('date')}: {content_preview}...")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR checking journal_entries: {e}")
        if "does not exist" in str(e).lower():
            print("   - journal_entries table doesn't exist!")
            print("   - Create it in Supabase SQL editor")
        return False


def check_pinecone_vectors(user_id: str):
    """Check if journal entries are in Pinecone"""
    print("\n" + "="*60)
    print("CHECKING PINECONE VECTORS")
    print("="*60)
    
    try:
        from services.pinecone_client import index
        
        # Query with user_id filter to see if any vectors exist
        results = index.query(
            vector=[0.0] * 768,  # Dummy vector
            top_k=10,
            filter={"user_id": {"$eq": user_id}},
            include_metadata=True
        )
        
        matches = results.get("matches", [])
        print(f"✓ Journal vectors in Pinecone: {len(matches)}")
        
        if len(matches) == 0:
            print("⚠️  WARNING: No vectors found in Pinecone!")
            print("   - Journal entries may not have been vectorized")
            print("   - Try creating a new journal entry to trigger vectorization")
            return False
        
        # Show samples
        print(f"\n✓ Sample vectors:")
        for i, match in enumerate(matches[:3], 1):
            metadata = match.get("metadata", {})
            content_preview = metadata.get('content', '')[:60]
            print(f"   {i}. {metadata.get('date')}: {content_preview}...")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR checking Pinecone: {e}")
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python diagnostic_check.py <user_id>")
        print("\nTo find your user_id:")
        print("1. Open browser dev tools (F12)")
        print("2. Go to Application > Local Storage")
        print("3. Look for Supabase auth token and decode it")
        print("   OR check network requests for /api/health-data")
        sys.exit(1)
    
    user_id = sys.argv[1]
    print(f"\n🔍 Running diagnostics for user: {user_id}\n")
    
    # Run all checks
    health_ok = check_health_metrics(user_id)
    journal_ok = check_journal_entries(user_id)
    pinecone_ok = check_pinecone_vectors(user_id)
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Health Metrics: {'✓ OK' if health_ok else '⚠️  ISSUES'}")
    print(f"Journal Entries: {'✓ OK' if journal_ok else '⚠️  ISSUES'}")
    print(f"Pinecone Vectors: {'✓ OK' if pinecone_ok else '⚠️  ISSUES'}")
    
    if not all([health_ok, journal_ok, pinecone_ok]):
        print("\n⚠️  Some components have issues. See details above.")
        print("\nNext steps:")
        print("1. Visit the dashboard to trigger Sahha data fetch")
        print("2. Create a journal entry to test vectorization")
        print("3. Restart backend: cd api && uv run uvicorn index:app --reload")
    else:
        print("\n✓ All checks passed! Data exists and should be accessible.")
        print("\nIf forecasting/journal search still don't work:")
        print("1. Restart backend to apply code fixes")
        print("2. Check logs for [METRIC_NORMALIZE] and [JOURNAL_SEARCH] messages")

