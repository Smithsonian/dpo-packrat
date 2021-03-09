FROM nginx:1.17.10 as proxy
EXPOSE 80
RUN rm /usr/share/nginx/html/*
COPY ./conf/nginx/nginx-prod.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]
