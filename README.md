# SMTP Email Aggregator Add-on

This add-on provides an SMTP server that aggregates and relays emails.

## Features

- Listens for incoming emails
- Aggregates matching pairs of emails (e.g., invoices and statements)
- Forwards aggregated emails to a specified SMTP server

## Configuration

Example add-on configuration:

```yaml
outgoing_host: smtp.example.com
outgoing_port: 587
outgoing_secure: false
outgoing_auth_user: your_username
outgoing_auth_pass: your_password
incoming_host: 0.0.0.0
incoming_port: 5025
aggregate_subject: "Consolidated Invoice and Statement for {name}"
aggregate_bodyFile: "body.txt"
aggregate_waitForUpToMinutes: 5
aggregate_checkExpiryEverySeconds: 10
sendQueue_threads: 3
sendQueue_pollIntervalSeconds: 5
sendQueue_failure_retries: 5
sendQueue_failure_pauseMinutes: 1
```

### Option: `outgoing_host`

The hostname of the SMTP server to forward emails to.

### Option: `outgoing_port`

The port of the outgoing SMTP server.

...

[Continue with explanations for all options]

## Support

Got questions? Please post them on the [Home Assistant community forum](https://community.home-assistant.io/).

