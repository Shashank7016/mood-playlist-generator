from transformers import pipeline

classifier = pipeline('sentiment-analysis')

def analyze_mood(text):
    result = classifier(text)[0]
    sentiment = result['label']
    score = result['score']
    
    if sentiment == 'POSITIVE' and score > 0.7:
        return 'happy'
    elif sentiment == 'NEGATIVE' and score > 0.7:
        return 'sad'
    else:
        return 'neutral'

if __name__ == "__main__":
    import sys
    text = sys.argv[1]
    mood = analyze_mood(text)
    print(mood)
