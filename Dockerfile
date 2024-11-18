ARG BUILD_FROM
FROM $BUILD_FROM

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install Node.js and npm
RUN apk add --no-cache nodejs npm

# Set workdir
WORKDIR /smtp_email_aggregator

# Copy package.json and package-lock.json
COPY smtp_email_aggregator/package*.json ./

# Install all dependencies
RUN npm install
RUN npm install --save-dev @types/smtp-server

# Copy the entire project
COPY smtp_email_aggregator ./

# Run TypeScript compilation
RUN npm run build

# Copy the entire project
COPY smtp_email_aggregator ./

RUN echo "Contents of src directory:" && ls -R src

RUN echo "Contents of dist directory:" && \
    ls -R dist || echo "dist directory not found"

# Copy root filesystem
COPY rootfs /

RUN chmod a+x /etc/services.d/smtp_email_aggregator/run && \
    chmod a+x /etc/cont-init.d/setup-postfix.sh

# Copy config.yaml to the root
COPY config.yaml /smtp_email_aggregator/

RUN echo "TypeScript version:" && npx tsc --version && \
    echo "TypeScript compiler options:" && npx tsc --showConfig && \
    npm run build -- --listFiles

# Make run script executable
RUN chmod a+x /etc/services.d/smtp_email_aggregator/run

# Install Postfix and required packages
RUN apk add --no-cache \
    postfix \
    cyrus-sasl \
    libsasl \
    ca-certificates \
    openssl && \
    mkdir -p /var/spool/postfix && \
    mkdir -p /var/lib/postfix && \
    mkdir -p /etc/postfix && \
    chown -R root:root /etc/postfix && \
    chmod -R 755 /etc/postfix
    
# Build arguments and labels (as in your provided Dockerfile)
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_DESCRIPTION
ARG BUILD_NAME
ARG BUILD_REF
ARG BUILD_REPOSITORY
ARG BUILD_VERSION

# Labels
LABEL \
    io.hass.name="${BUILD_NAME}" \
    io.hass.description="${BUILD_DESCRIPTION}" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version=${BUILD_VERSION} \
    maintainer="Your Name <your@email.com>" \
    org.opencontainers.image.title="${BUILD_NAME}" \
    org.opencontainers.image.description="${BUILD_DESCRIPTION}" \
    org.opencontainers.image.vendor="Home Assistant Add-ons" \
    org.opencontainers.image.authors="Your Name <your@email.com>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/your_repository" \
    org.opencontainers.image.source="https://github.com/${BUILD_REPOSITORY}" \
    org.opencontainers.image.documentation="https://github.com/${BUILD_REPOSITORY}/blob/main/README.md" \
    org.opencontainers.image.created=${BUILD_DATE} \
    org.opencontainers.image.revision=${BUILD_REF} \
    org.opencontainers.image.version=${BUILD_VERSION}

# Start S6 init system
ENTRYPOINT ["/init"]




