# Api StudyTime
Esta api se construyo para ser utilizada con el siguiente [FrontEnd en React ](https://github.com/ilanmazza/test_react)

# Deploy
### Metodo facil (Docker compose)
#### Requisitos
- Instalacion local de docker y docker-compose (incluido en docker-desktop)✔️
#### Instrucciones
Copiar example.env a .env
```
cp example.env .env
```
Modificar las variables MAIL_USERNAME y MAIL_PASSWORD en .env
[Gmail permite generar contraseñas para aplicaciones unica](https://www.lifewire.com/get-a-password-to-access-gmail-by-pop-imap-2-1171882)
```
MAIL_USERNAME=<tu-usuario-de-gmail>
MAIL_PASSWORD=<password>
```
Inciar Docker Compose
```
sudo docker-compose up -d
```

### Metodo manual
#### Requisitos
- Instalacion local de mongoDB ✔️
- Node 18 o superior ✔️
#### Instrucciones
Copiar example.env a .env
```
cp example.env .env
```
Modificar las variables MAIL_USERNAME, MAIL_PASSWORD y MONGO_DB_URI en .env
[Gmail permite generar contraseñas para aplicaciones unica](https://www.lifewire.com/get-a-password-to-access-gmail-by-pop-imap-2-1171882)
```
MONGO_DB_URI="mongodb://localhost/studytime"
MAIL_USERNAME=<tu-usuario-de-gmail>
MAIL_PASSWORD=<password>
```
Instalar modulos de node
```
npm install
```
Iniciar server
```
npm start
```