FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG NEXT_PUBLIC_API_TARGET=http://localhost:8000
ENV NEXT_PUBLIC_API_TARGET=${NEXT_PUBLIC_API_TARGET}
RUN npm run build
EXPOSE 3000
CMD ["npm", "start", "--", "-H", "0.0.0.0"]
