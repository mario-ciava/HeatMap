FROM nginx:1.27-alpine

# Remove default site config and add our static site config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy static assets
COPY index.html /usr/share/nginx/html/index.html
COPY css /usr/share/nginx/html/css
COPY src /usr/share/nginx/html/src
COPY proxy-bootstrap.js /usr/share/nginx/html/proxy-bootstrap.js

# Ensure correct permissions for served files
RUN chmod -R 755 /usr/share/nginx/html
