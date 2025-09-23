cd frontend

npm install

replace your api link that all jsx

npm start       # run in development mode
npm run build   # build for production

next

create database and import the data.sql

cd backend

dotnet publish -c Release -r linux-x64 --self-contained true /p:PublishProfile=DefaultContainer

Copy the published files.

Create a .env file with the following content:

PSQL_CONNECTION="Host=localhost;Port=5432;Username=postgres;Password=password;Database=flightfocus;Pooling=true;MaxPoolSize=100;Timeout=5;"

JWT_SECRET=your_super_secret_key_here_min_256bit

SMTP_HOSTNAME=
SMTP_HOSTPORT=
SMTP_USERNAME=
SMTP_PASSWORD=
