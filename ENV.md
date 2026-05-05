# Environment Variables Reference

This project has **two** sets of environment variables — one for the Next.js frontend and one for the FastAPI backend.

## Frontend (`/.env` at project root)

Copy `.env.example` → `.env` and fill in values.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | yes | `http://localhost:8000` | Base URL where the FastAPI backend is reachable from the browser. Must start with `NEXT_PUBLIC_` to be exposed to the client. |

Example `.env`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

For production behind a domain:
```env
NEXT_PUBLIC_API_BASE_URL=https://api.nirnayai.gov.in
```

## Backend (`/backend/.env`)

Copy `backend/.env.example` → `backend/.env` and adjust.

### Core
| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `NirnayAI Backend` | Shown in health check + docs |
| `APP_VERSION` | `1.0.0` | API version |
| `ENVIRONMENT` | `development` | `development` / `staging` / `production` |
| `DEBUG` | `true` | Enables verbose logging |
| `HOST` | `0.0.0.0` | Bind address for uvicorn |
| `PORT` | `8000` | Bind port |
| `LOG_LEVEL` | `INFO` | `DEBUG` / `INFO` / `WARNING` / `ERROR` |

### Security / CORS
| Variable | Default | Description |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated list of allowed frontend origins. **Update this for production!** |

### File handling
| Variable | Default | Description |
|---|---|---|
| `TEMP_UPLOAD_DIR` | `./temp_uploads` | Where uploaded PDFs are stored temporarily |
| `MAX_UPLOAD_MB` | `50` | Max upload size in MB (not yet enforced — available for future use) |

### ML integration (add when pickle files are ready)
| Variable | Default | Description |
|---|---|---|
| `USE_ML` | `false` | Master switch — set `true` to enable pickle-loaded models |
| `ML_MODEL_PATH` | *(empty)* | Absolute or relative path to your criteria extraction model pickle, e.g. `./models/criteria_extractor.pkl` |
| `ML_VENDOR_MODEL_PATH` | *(empty)* | Path to vendor data extraction model pickle |

**When your Colab training is complete:**
1. `pickle.dump(model, open('model.pkl', 'wb'))` in Colab
2. Download and place the `.pkl` files into `backend/models/` (create the directory)
3. Edit `backend/.env`:
   ```env
   USE_ML=true
   ML_MODEL_PATH=./models/criteria_extractor.pkl
   ML_VENDOR_MODEL_PATH=./models/vendor_extractor.pkl
   ```
4. Restart uvicorn. The `/health` endpoint will confirm models loaded:
   ```json
   { "ml_enabled": true, "ml_criteria_model_loaded": true, "ml_vendor_model_loaded": true }
   ```

The system keeps running with deterministic mock logic until models are loaded — no breaking changes required.

## Expected pickle model interface

When you build the models in Colab, make sure they expose a `.predict()` method:

```python
class CriteriaExtractor:
    def predict(self, tender_text: str) -> list[dict]:
        # returns list of dicts with keys: id, description, threshold, mandatory, confirmed
        ...

class VendorDataExtractor:
    def predict(self, vendor_text: str) -> dict:
        # returns dict with keys: technical_score, turnover_crores,
        #                         has_registrations, delivery_months
        ...
```

If the shape differs, `backend/services/ml_loader.py` will gracefully fall back to the mock.
