from textblob import TextBlob
import sys

text = sys.argv[1]
blob = TextBlob(text)
polarity = blob.sentiment.polarity

if polarity > 0.1:
    mood = 'happy'
elif polarity < -0.1:
    mood = 'sad'
else:
    mood = 'neutral'

print(mood)
