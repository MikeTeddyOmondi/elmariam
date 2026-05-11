FROM devopsfaith/krakend:2
COPY krakend.json /etc/krakend/krakend.json
EXPOSE 8009
CMD ["/usr/bin/krakend", "run", "-d", "-c", "/etc/krakend/krakend.json", "-p", "8009"]
