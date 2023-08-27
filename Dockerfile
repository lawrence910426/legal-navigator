FROM node:20-buster

WORKDIR /app

COPY . .
RUN npm install

RUN apt update -y && apt install -y python3 python3-pip
RUN pip3 install pip install gdown

CMD ["node", "index.js"]
