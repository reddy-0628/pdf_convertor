FROM python:3.10-slim

RUN apt-get update && apt-get install -y libreoffice


WORKDIR /app

COPY . .

RUN pip3 install -r requirements.txt

EXPOSE 8000

CMD [ "python3", "main.py"]