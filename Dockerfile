FROM alpine:latest

RUN apk add --no-cache unzip ca-certificates

ARG PB_VERSION=0.36.9
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

COPY pb/pb_hooks /pb/pb_hooks
COPY pb/pb_migrations /pb/pb_migrations
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

CMD ["/entrypoint.sh"]
