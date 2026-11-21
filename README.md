# Taha Clinic — clone & run

Remote clinic app. Patient names stay on **your PC**.  
Only anonymized diagnoses sync to the shared Taha cloud database.

## What you need from the owner

1. This GitHub repository  
2. Their `.env` values (file `GIVE_TO_FRIEND.env`, or at least):
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (Publishable key)
3. Your own facility code, e.g. `CLN-FRIEND-001`

## Setup

```bash
git clone https://github.com/Omda-Si/Taha-ERP-epidemiology.git
cd Taha-ERP-epidemiology/clinic

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

mkdir -p ~/.local/share/taha-clinic
```

Put the owner’s env file here:

```bash
# If they sent you GIVE_TO_FRIEND.env:
cp /path/to/GIVE_TO_FRIEND.env ~/.local/share/taha-clinic/.env

# Or create it from the example and paste the keys they gave you:
cp .env.example ~/.local/share/taha-clinic/.env
nano ~/.local/share/taha-clinic/.env
```

Change `FACILITY_CODE` to a unique code for your clinic.

## Run

```bash
cd clinic
source .venv/bin/activate
python desktop_app.py
```

1. Add a patient  
2. Save a **diagnosis**  
3. Data appears in the owner’s Supabase / Taha HQ  

The owner’s PC does **not** need to stay online.

## Requirements

- Python 3.10+
- Internet
- Linux, macOS, or Windows WSL / Git Bash

## Do not

- Commit or publish your `.env`
- Share database passwords
- Expect patient names in the cloud (they never leave your PC)
