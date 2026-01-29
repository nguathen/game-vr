# Performance Rules

## Response Time Targets

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| API endpoint | <100ms | <500ms |
| Database query | <50ms | <200ms |
| Page load | <1s | <3s |
| Background job | <30s | <60s |

## Algorithm Complexity

### Prefer
| Operation | Complexity |
|-----------|------------|
| Hash lookup | O(1) |
| Binary search | O(log n) |
| Single loop | O(n) |
| Sorting | O(n log n) |

### Avoid
| Pattern | Complexity | Fix |
|---------|------------|-----|
| Nested loops | O(n²) | Use hash map |
| Triple nested | O(n³) | Redesign algorithm |
| Recursive without memo | Exponential | Add memoization |

## Database Performance

### Query Optimization

```python
# BAD: N+1 query
for user in users:
    orders = get_orders(user.id)  # N queries!

# GOOD: Batch query
user_ids = [u.id for u in users]
orders = get_orders_batch(user_ids)  # 1 query
```

### Index Guidelines
- ✅ Index columns used in WHERE
- ✅ Index columns used in JOIN
- ✅ Index columns used in ORDER BY
- ❌ Don't over-index (write penalty)

### Query Anti-Patterns
- ❌ SELECT * (fetch only needed columns)
- ❌ No LIMIT on large tables
- ❌ LIKE '%prefix' (can't use index)
- ❌ Functions in WHERE clause

## Memory Management

### Python Specific

```python
# BAD: String concatenation in loop
result = ""
for item in items:
    result += str(item)  # Creates new string each time

# GOOD: Use join
result = "".join(str(item) for item in items)

# BAD: Load all into memory
data = list(huge_generator())

# GOOD: Process in chunks
for chunk in chunked(huge_generator(), 1000):
    process(chunk)
```

### Memory Anti-Patterns
- ❌ Loading entire file into memory
- ❌ Unbounded caches
- ❌ Circular references
- ❌ Large global variables

## Caching Strategy

### Cache Levels

| Level | Use Case | TTL |
|-------|----------|-----|
| L1 (in-memory) | Hot data, computed values | 1-5 min |
| L2 (Redis) | Session, frequently accessed | 5-60 min |
| L3 (CDN) | Static assets | 1 day+ |

### Cache Invalidation

```python
# Pattern: Cache-aside
def get_user(user_id):
    # Try cache first
    cached = cache.get(f"user:{user_id}")
    if cached:
        return cached

    # Fetch from DB
    user = db.get_user(user_id)

    # Store in cache
    cache.set(f"user:{user_id}", user, ttl=300)
    return user

# Invalidate on update
def update_user(user_id, data):
    db.update_user(user_id, data)
    cache.delete(f"user:{user_id}")
```

## Async/Concurrency

### When to Use Async
- ✅ I/O bound operations (API calls, DB)
- ✅ Multiple independent requests
- ❌ CPU bound operations (use multiprocessing)

### Connection Pooling

```python
# BAD: New connection per request
def get_data():
    conn = create_connection()
    result = conn.query(...)
    conn.close()
    return result

# GOOD: Connection pool
pool = create_pool(min=5, max=20)

def get_data():
    with pool.connection() as conn:
        return conn.query(...)
```

## Profiling Before Optimizing

```bash
# Python profiling
python -m cProfile -s cumtime script.py

# Line profiler
kernprof -l -v script.py

# Memory profiler
python -m memory_profiler script.py
```

**Rule: Measure first, optimize second. Premature optimization is the root of all evil.**
