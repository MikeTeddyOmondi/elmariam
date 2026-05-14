FROM krakend:2.13
COPY krakend.json /etc/krakend/krakend.json
EXPOSE 8009
CMD ["/usr/bin/krakend", "run", "-d", "-c", "/etc/krakend/krakend.json", "-p", "8009"]
