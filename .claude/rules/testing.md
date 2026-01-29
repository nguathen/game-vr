# Testing Rules

## Test Pyramid

```
       /\        E2E (5%) - Critical user journeys only
      /--\       Integration (15%) - API, service interactions
     /----\      Unit (80%) - Functions, classes, edge cases
```

## Coverage Targets

| Type | Target | Minimum |
|------|--------|---------|
| New code | 90%+ | 80% |
| Overall | 80%+ | 70% |
| Critical paths | 100% | 95% |

## AAA Pattern (Mandatory)

```python
def test_function_name():
    # Arrange - Setup test data
    data = create_test_data()

    # Act - Execute the function
    result = function_under_test(data)

    # Assert - Verify the result
    assert result == expected_value
```

## Edge Cases Checklist

### Input Validation
- [ ] Empty/null/None
- [ ] Maximum length
- [ ] Minimum length
- [ ] Special characters
- [ ] Unicode/emoji
- [ ] Whitespace only

### Numeric
- [ ] Zero
- [ ] Negative
- [ ] Very large (overflow)
- [ ] Decimal precision
- [ ] Division by zero

### Collections
- [ ] Empty
- [ ] Single item
- [ ] Very large
- [ ] Duplicates
- [ ] None items

### Async/Concurrency
- [ ] Race conditions
- [ ] Timeout handling
- [ ] Deadlocks

## Mocking Guidelines

| Scenario | Mock? | Reason |
|----------|-------|--------|
| External API | ✅ Yes | Unreliable, slow |
| Database | ⚠️ Sometimes | Verify queries work |
| File system | ⚠️ Sometimes | Side effects |
| Time/Date | ✅ Yes | Deterministic |
| Internal classes | ❌ Rarely | Test real behavior |

## Test Naming

```python
# Pattern: test_<what>_<condition>_<expected>
def test_login_with_invalid_password_returns_401():
    pass

def test_calculate_total_with_discount_applies_percentage():
    pass
```

## Fixtures Best Practices

```python
@pytest.fixture
def sample_user():
    """Minimal user for auth tests."""
    return User(id="test-1", email="test@example.com")

@pytest.fixture
def authenticated_client(sample_user):
    """Pre-authenticated test client."""
    client = TestClient(app)
    client.headers["Authorization"] = f"Bearer {create_token(sample_user)}"
    return client
```

## Anti-Patterns to Avoid

- ❌ Tests depending on other tests
- ❌ Testing implementation, not behavior
- ❌ Flaky tests (random failures)
- ❌ Slow tests in unit test suite
- ❌ No assertions (test does nothing)
- ❌ Too many assertions per test
