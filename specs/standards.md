# GPM Controller - Coding Standards

> **Last Updated:** 2025-01-08
> **Language:** Python 3.7+
> **Parent:** `CLAUDE.md` → DOCUMENT HIERARCHY
> **Used by:** `/dev`, `/code-check` agents

---

## 1. Project Structure

```
routes/     - Flask Blueprints (API endpoints)
services/   - Business logic
managers/   - Lifecycle management
models/     - Pydantic data models
config/     - Configuration (Pydantic Settings)
utils/      - Utilities
middleware/ - Request middleware
exceptions/ - Custom exceptions
```

---

## 2. Naming Conventions

### Files
- Snake_case: `profile_service.py`, `gpm_api_client.py`
- Test files: `test_<module>.py`

### Classes
- PascalCase: `ProfileManager`, `ClaudeHelper`
- Pydantic models: `Profile`, `BrowserSession`

### Functions/Methods
- Snake_case: `get_profile()`, `open_browser_session()`
- Private: `_internal_method()`

### Variables
- Snake_case: `profile_id`, `debug_port`
- Constants: `UPPER_CASE`

---

## 3. Code Style

### Imports
```python
# Standard library
import os
import threading
from typing import Optional, List, Dict

# Third-party
from flask import Blueprint, jsonify
from pydantic import BaseModel

# Local
from services.gpm_api_client import GPMApiClient
from models.profile import Profile
```

### Type Hints
```python
def get_profile(profile_id: str) -> Optional[Profile]:
    ...

def get_profiles(
    group_id: Optional[str] = None,
    page: int = 1,
    per_page: int = 20
) -> List[Profile]:
    ...
```

### Docstrings
```python
def open_profile(profile_id: str) -> BrowserSession:
    """
    Open a browser profile session.
    
    Args:
        profile_id: The profile ID to open
        
    Returns:
        BrowserSession with debug port info
        
    Raises:
        ProfileNotFoundError: If profile doesn't exist
    """
```

---

## 4. Flask Routes

### Blueprint Structure
```python
# routes/profiles.py
from flask import Blueprint, jsonify, request

profiles_bp = Blueprint('profiles', __name__, url_prefix='/api/profiles')

@profiles_bp.route('/', methods=['GET'])
def get_profiles():
    # Implementation
    return jsonify({"success": True, "data": results})

@profiles_bp.route('/<profile_id>', methods=['GET'])
def get_profile(profile_id: str):
    # Implementation
    pass
```

### Response Format
```python
# Success
return jsonify({
    "success": True,
    "data": result
})

# Error
return jsonify({
    "success": False,
    "error": str(e)
}), 400
```

---

## 5. Pydantic Models

```python
from pydantic import BaseModel, computed_field
from typing import Optional

class Profile(BaseModel):
    id: str
    name: str
    raw_proxy: Optional[str] = None
    browser_type: Optional[str] = None
    
    model_config = {"extra": "ignore"}

class BrowserSession(BaseModel):
    profile_id: str
    remote_debugging_address: str
    
    @computed_field
    @property
    def debug_port(self) -> int:
        return int(self.remote_debugging_address.split(':')[1])
```

---

## 6. Configuration

```python
from pydantic_settings import BaseSettings

class GPMConfig(BaseSettings):
    api_url: str = "http://127.0.0.1:19995"
    timeout: int = 30
    
    model_config = {"env_prefix": "GPM_"}
```

---

## 7. Error Handling

### Custom Exceptions
```python
# exceptions/base.py
class AppError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code

# exceptions/profile.py
class ProfileNotFoundError(AppError):
    def __init__(self, profile_id: str):
        super().__init__(f"Profile {profile_id} not found", 404)
```

### Route Error Handling
```python
@profiles_bp.route('/<profile_id>')
def get_profile(profile_id: str):
    try:
        profile = service.get_profile(profile_id)
        return jsonify({"success": True, "data": profile.model_dump()})
    except ProfileNotFoundError as e:
        return jsonify({"success": False, "error": e.message}), e.status_code
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
```

---

## 8. Logging

```python
from utils.logger import get_logger

logger = get_logger(__name__)

# Usage
logger.info(f"Opening profile {profile_id}")
logger.error(f"Failed to open: {e}")
logger.debug(f"Debug info: {data}")
```

---

## 9. WebSocket Events

```python
from services.websocket_service import emit_profile_status, emit_toast

# Emit profile status
emit_profile_status(profile_id, "opened", port)

# Emit toast notification
emit_toast("Profile opened successfully", "success")
```

---

## 10. Testing

```python
# tests/test_profile_service.py
import pytest
from services.profile_service import ProfileService

class TestProfileService:
    def test_get_profile_success(self):
        service = ProfileService()
        result = service.get_profile("test-id")
        assert result is not None
        
    def test_get_profile_not_found(self):
        service = ProfileService()
        with pytest.raises(ProfileNotFoundError):
            service.get_profile("invalid-id")
```

---

## 11. Git Workflow

### Branch Naming
- `feature/TASK-XXX-description`
- `bugfix/BUG-XXX-description`
- `hotfix/critical-issue`

### Commit Messages
```
[TASK-XXX] Short description

- Detail 1
- Detail 2
```

---

## 12. Dependencies

Add to `requirements.txt`:
```
package-name>=1.0.0
```

Run:
```bash
pip install -r requirements.txt
```
