import express from 'express';
import https from 'https';
import fs from 'fs';
import bodyParser from 'body-parser';
import FormData from 'form-data';
import multer from 'multer';
import fetch from 'node-fetch';
import { pipeline } from 'stream';
import { promisify } from 'util';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const upload = multer();
const pipelineAsync = promisify(pipeline);

const options = {
    key: fs.readFileSync("//etc/letsencrypt/live/nova.monitor.eco.br/privkey.pem"),
    cert: fs.readFileSync("//etc/letsencrypt/live/nova.monitor.eco.br/fullchain.pem")
  };

var httpsServer = https.createServer(options, app);

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

const sendTextMessage = async (message) => {
    
  const response = await fetch('https://gate.whapi.cloud/messages/text', {
    method: 'POST',
    headers: {
      Authorization: `Bearer JggSqEFstZ8K4E7Pt1XMQFGx5bn3a4L6`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
  const data = await response.json();
  return data;
};

app.post('/send-message', async function(req,res){

const response = await sendTextMessage(
  req.body
);

res.status(200).send(response)

});

const sendFile = async (form) => {
  const response = await fetch('https://gate.whapi.cloud/messages/document', {
    method: 'POST',
    headers: {
      Authorization: `Bearer JggSqEFstZ8K4E7Pt1XMQFGx5bn3a4L6`,
      ...form.getHeaders()
    },
    body: form,
    timeout: 60000
  });
  const data = await response.json();
  return data;
};

app.post('/send-file',upload.single('media'), async function(req,res){

  if (!req.file) {
    return res.status(400).send('Nenhum arquivo recebido');
  }
  const form = new FormData();

  for (const [key, value] of Object.entries(req.body)) {
    form.append(key, value);
  }

  form.append('media', req.file.buffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype
  });  

try {
  const response = await sendFile(form);
  res.status(200).send("Enviado com sucesso!");
} catch (error) {
  console.error('Erro ao enviar arquivo:', error);
  res.status(500).send('Erro interno do servidor');
}

});

httpsServer.listen(3110,function(erro){
  if(erro){
      console.log("Ocorreu um erro!")
  }else{
      console.log("Servidor iniciado com sucesso!")
  }
})
