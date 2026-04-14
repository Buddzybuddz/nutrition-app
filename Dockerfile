FROM alpine:latest

# Install necessary dependencies
RUN apk add --no-cache unzip ca-certificates

# Download and unzip PocketBase
ARG PB_VERSION=0.36.9
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# Expose the PocketBase port
EXPOSE 8080

# Start PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]
