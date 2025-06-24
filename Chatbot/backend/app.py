import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests for the frontend

# URL of the Rasa API
RASA_URL = "http://localhost:5005/webhooks/rest/webhook"

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    try:
        # Send the user's message to Rasa
        response = requests.post(RASA_URL, json={"sender": "user", "message": user_message})
        response.raise_for_status()  # Check for HTTP errors

        # Extract the response from Rasa
        rasa_responses = response.json()
        if rasa_responses:
            # Combine all Rasa responses into a single string
            bot_response = "\n".join([resp.get("text", "") for resp in rasa_responses if "text" in resp])
        else:
            bot_response = "No response from Rasa"

        return jsonify({"response": bot_response})

    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Failed to connect to Rasa. Is Rasa running on port 5005?"}), 500
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)