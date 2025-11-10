"""
Quick test to verify dashboard data loading works
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.supabase_client import get_supabase_client
from services.sahha import sahha_client
from datetime import datetime, timedelta

def test_sahha_connection():
    """Test if Sahha API is configured and returning data"""
    print("\n" + "="*60)
    print("TESTING SAHHA API CONNECTION")
    print("="*60)
    
    try:
        # Test account token
        sahha_client.ensure_account_token()
        print("✓ Sahha account token obtained")
        
        # Try to get biomarkers for a test period
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)
        
        # This will fail if profile doesn't exist, but that's OK
        try:
            biomarkers = sahha_client.get_biomarkers(
                external_id="test-user",
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat()
            )
            print(f"✓ Sahha API responding (returned {len(biomarkers)} biomarkers for test)")
        except Exception as e:
            if "not found" in str(e).lower() or "404" in str(e):
                print("✓ Sahha API responding (profile not found, but API works)")
            else:
                print(f"⚠️  Sahha API error: {e}")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Sahha API connection failed: {e}")
        print("   - Check SAHHA_CLIENT_ID and SAHHA_CLIENT_SECRET in .env")
        return False


def test_supabase_write():
    """Test if we can write to Supabase health_metrics table"""
    print("\n" + "="*60)
    print("TESTING SUPABASE WRITE PERMISSIONS")
    print("="*60)
    
    try:
        import uuid
        supabase = get_supabase_client()
        
        # Try to insert a test record (use proper UUID)
        test_user_id = "00000000-0000-0000-0000-000000000000"
        test_record = {
            "user_id": test_user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "metric_type": "test_metric",
            "value": "123",
            "unit": "test",
            "source": "test"
        }
        
        result = supabase.table("health_metrics").insert(test_record).execute()
        
        if result.data:
            print("✓ Successfully wrote to health_metrics table")
            
            # Clean up
            supabase.table("health_metrics").delete().eq(
                "user_id", test_user_id
            ).execute()
            print("✓ Successfully deleted test record")
            return True
        else:
            print("⚠️  Insert returned no data")
            return False
            
    except Exception as e:
        error_msg = str(e).lower()
        if "does not exist" in error_msg or "not found" in error_msg:
            print("❌ health_metrics table does not exist!")
            print("   - Run api/schema/health_metrics.sql in Supabase SQL Editor")
        elif "permission" in error_msg or "rls" in error_msg:
            print("❌ Permission denied - RLS policy issue")
            print("   - Check Row Level Security policies in Supabase")
        else:
            print(f"❌ Supabase write failed: {e}")
        return False


def check_dashboard_endpoint():
    """Check if the dashboard endpoint would work"""
    print("\n" + "="*60)
    print("RECOMMENDATIONS")
    print("="*60)
    
    print("\n1. Ensure health_metrics table exists:")
    print("   - Go to Supabase SQL Editor")
    print("   - Run: api/schema/health_metrics.sql")
    
    print("\n2. Visit the dashboard in your browser:")
    print("   - This triggers /api/health-data endpoint")
    print("   - Should fetch from Sahha and batch insert to Supabase")
    print("   - Watch terminal for 'Batch inserted' messages")
    
    print("\n3. Create a journal entry:")
    print("   - Go to Journal page in app")
    print("   - Create any entry")
    print("   - Should vectorize and add to Pinecone")
    print("   - Watch for '[PINECONE_ADD]' in logs")
    
    print("\n4. Then test Deep Dive again:")
    print("   - Forecasting will work with 14+ data points")
    print("   - Journal search will find your entries")


if __name__ == "__main__":
    print("\n🔍 Testing Data Loading Components\n")
    
    sahha_ok = test_sahha_connection()
    supabase_ok = test_supabase_write()
    
    print("\n" + "="*60)
    print("RESULTS")
    print("="*60)
    print(f"Sahha API: {'✓ OK' if sahha_ok else '❌ FAILED'}")
    print(f"Supabase Write: {'✓ OK' if supabase_ok else '❌ FAILED'}")
    
    if not sahha_ok or not supabase_ok:
        print("\n⚠️  Fix the failed components before proceeding")
        sys.exit(1)
    else:
        print("\n✓ All components working! Database is just empty.")
        check_dashboard_endpoint()

