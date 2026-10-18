# Seed content source notes

The course and quiz copy in `seed.sql` is authored synthetic content. It does not include scraped live URLs, real people, or user data.

Indicator themes (such as misleading URL structure, urgency, sender identity, and the limits of HTTPS) were checked against the UCI **Phishing Websites** dataset. The dataset was published in 2015, has 11,055 instances and 30 engineered features, and is licensed CC BY 4.0. It is used as background for examples, not copied as learner-facing questions or as a live URL blocklist. Its age makes it unsuitable as a current threat feed.

Source: https://archive.ics.uci.edu/dataset/327/phishing%2Bwebsites

Google account sign-in uses Google's OpenID Connect server flow and Authlib's Starlette client. Only the stable Google subject, verified email, and display name are used to create/link a learner account; Google API access tokens are not retained. The app requests only `openid email profile`.
