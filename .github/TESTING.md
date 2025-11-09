# Testing & CI/CD Guide

## Local Testing

### Backend Tests

Run pytest tests locally:

```bash
cd api
uv venv
uv pip install -e ".[dev]"
uv run pytest
```

Run with coverage:

```bash
uv run pytest --cov=. --cov-report=html
```

Run specific test file:

```bash
uv run pytest tests/test_anomaly_detection.py -v
```

### Security Scanning

Run Bandit for Python vulnerability scan:

```bash
cd api
bandit -r . -f json -o bandit-report.json
```

Check dependencies:

```bash
bun audit
```

## CI/CD Pipeline Overview

The GitHub Actions workflow runs on every push to `main` or `develop` and on all pull requests.

### Pipeline Stages

1. **Frontend Build & Lint** (parallel)
   - Install dependencies with Bun
   - Run ESLint
   - Build Next.js project

2. **Backend Tests** (parallel)
   - Setup Python 3.11 environment
   - Install dependencies with uv
   - Run pytest with coverage
   - Generate coverage reports

3. **Security Scan - Python** (parallel)
   - Run Bandit vulnerability scanner
   - Check for security issues in Python code

4. **Security Scan - Dependencies** (parallel)
   - Check npm/Bun dependencies for vulnerabilities

5. **Build Status** (sequential)
   - Aggregate results from all jobs
   - Fail if frontend build or backend tests fail

### Environment

- Node.js: 20
- Python: 3.11
- Bun: Latest
- uv: Latest

### Artifacts

- Frontend build (`.next`)
- Coverage report (coverage.xml)
- Bandit security report (bandit-report.json)

## Test Structure

### Fixtures (conftest.py)

- `mock_user_id`: Test user ID
- `mock_health_data`: 30 days of health metrics
- `mock_insufficient_data`: Less than minimum required data
- `mock_journal_entries`: Sample journal entries
- `mock_multivariate_health_data`: Correlated health data

### Tools Tests

**test_anomaly_detection.py**
- Valid data detection
- Insufficient data handling
- No data handling
- Outlier identification

**test_correlation_analysis.py**
- Correlation computation
- Strength interpretation
- Threshold filtering
- Single metric handling

**test_forecasting.py**
- ARIMA forecasting
- Confidence intervals
- Forecast windows
- Moving average fallback

**test_journal_search.py**
- Semantic search results
- Empty results handling
- Custom limits
- Error handling

**test_external_research.py**
- Valid query processing
- Citation handling
- API error handling
- Empty queries

## Running in CI

The pipeline automatically runs when:
- Code is pushed to `main` or `develop`
- A pull request is created
- Code is merged into protected branches

View results:
1. Go to Actions tab in GitHub
2. Click on the workflow run
3. Expand job details to see logs
4. Download artifacts for detailed reports

## Troubleshooting

### Build Fails

Check the workflow logs for the specific failing job.

**Frontend issues:**
- Ensure `bun run lint` passes locally
- Check for TypeScript errors in build

**Backend issues:**
- Run `uv run pytest` locally
- Check for import errors or missing dependencies

### Coverage Drop

Review coverage reports:
1. Download coverage-report artifact
2. Open in IDE or coverage viewer
3. Check which lines are uncovered

### Security Warnings

Review Bandit report:
1. Download bandit-report artifact
2. Address high-severity issues
3. Add skip comments for false positives

```python
# nosec B101 - This is safe in tests
assert dangerous_operation()
```

## Best Practices

1. **Write tests** for new features
2. **Run locally first** before pushing
3. **Keep dependencies updated** in pyproject.toml
4. **Address security warnings** before merging
5. **Monitor coverage trends** to prevent regressions
