FROM node:18.18-alpine

# Defina a pasta de trabalho dentro do container
WORKDIR /app

# Copie o arquivo package.json e package-lock.json (se disponível)
COPY package*.json ./
COPY tsconfig*.json ./

# Instale as dependências da aplicação
RUN npm install

# Copie os arquivos da aplicação para o container
# COPY . .

# Compile a aplicação NestJS
RUN npm run build

# Expõe a porta 3000, que é a porta padrão que o NestJS escuta
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["npm", "start"]