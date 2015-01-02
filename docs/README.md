Some Notes
=======

TTL_ETL has the ability to ship a backup file to an Amazon S3 Bucket
There is an aws-sdk module in this app.  It needs to have access to the credentials for a given AWS instance.

TO do this:

Create a credentials file at ~/.aws/credentials on Mac/Linux or C:\Users\USERNAME\.aws\credentials on Windows

    aws_access_key_id = your_access_key

    aws_secret_access_key = your_secret_key
