FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl unzip && \
    rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p downloads

ENV PYTHONUNBUFFERED=1

EXPOSE 5000

CMD gunicorn --bind 0.0.0.0:${PORT:-5000} --timeout 180 --access-logfile - --error-logfile - app:app
