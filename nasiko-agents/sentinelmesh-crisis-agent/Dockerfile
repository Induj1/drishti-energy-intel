FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY src ./src
COPY Agentcard.json ./Agentcard.json

EXPOSE 5000
CMD ["uvicorn", "src.__main__:app", "--host", "0.0.0.0", "--port", "5000"]
