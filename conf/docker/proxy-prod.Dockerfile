FROM nginx:1.17.10 as proxy
EXPOSE 80
RUN rm /usr/share/nginx/html/*
COPY ./conf/nginx/nginx-prod.conf /etc/nginx/nginx.conf
COPY ./conf/nginx/conf.d/common-locations-prod /etc/nginx/conf.d/common-locations-prod
COPY ./conf/nginx/conf.d/common-locations-dev /etc/nginx/conf.d/common-locations-dev
# COPY ./conf/nginx/certs/packrat.si.edu.cert /etc/pki/tls/certs/packrat.si.edu.cert
# COPY ./conf/nginx/certs/packrat-test.si.edu.cert /etc/pki/tls/certs/packrat-test.si.edu.cert
# COPY ./conf/nginx/keys/packrat.si.edu.key /etc/pki/tls/private/packrat.si.edu.key
# COPY ./conf/nginx/keys/packrat-test.si.edu.key /etc/pki/tls/private/packrat-test.si.edu.key

CMD ["nginx", "-g", "daemon off;"]
