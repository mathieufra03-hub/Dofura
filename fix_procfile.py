with open('Procfile', 'w') as f:
    f.write('web: uvicorn main:app --host 0.0.0.0 --port $PORT')