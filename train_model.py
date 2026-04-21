# train_model.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

data = pd.read_csv("phishing_dataset.csv")

X = data.drop("label", axis=1)
y = data["label"]

model = RandomForestClassifier()
model.fit(X, y)

joblib.dump(model, "phishing_model.pkl")