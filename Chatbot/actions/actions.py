from typing import Any, Dict, Text, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher

class ActionProvideTips(Action):
    def name(self) -> Text:
        return "action_provide_tips"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        tips = [
            "Reduce, reuse, and recycle to minimize waste.",
            "Use energy-efficient appliances to lower energy consumption.",
            "Consider using public transportation, biking, or walking to reduce carbon emissions.",
            "Plant trees and support reforestation efforts.",
            "Educate others about the importance of reducing carbon emissions."
        ]
        dispatcher.utter_message(text="Here are some tips to help reduce carbon emissions:")
        for tip in tips:
            dispatcher.utter_message(text=f"- {tip}")
        return []

class ActionProvideEnvironmentalTips(Action):
    def name(self) -> Text:
        return "action_provide_environmental_tips"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        dispatcher.utter_message(text="Here are some general environmental tips: Save water, reduce waste, and conserve energy.")
        return []

class ActionAnswerGeneralQuestions(Action):
    def name(self) -> Text:
        return "action_answer_general_questions"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        dispatcher.utter_message(text="Feel free to ask me any questions about the environment!")
        return []

class ActionHandleFallback(Action):
    def name(self) -> Text:
        return "action_handle_fallback"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        dispatcher.utter_message(text="Sorry, I didn't understand that. Can you please rephrase?")
        return []

class ActionProvideRecyclingTips(Action):
    def name(self) -> Text:
        return "action_provide_recycling_tips"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        dispatcher.utter_message(text="Recycling helps reduce waste. Separate recyclables like paper, plastic, and glass, and avoid single-use plastics.")
        return []

class ActionProvideWaterConservationTips(Action):
    def name(self) -> Text:
        return "action_provide_water_conservation_tips"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        dispatcher.utter_message(text="To conserve water, fix leaks, use water-efficient appliances, and turn off taps when not in use.")
        return []

class ActionProvideRenewableEnergyInfo(Action):
    def name(self) -> Text:
        return "action_provide_renewable_energy_info"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        dispatcher.utter_message(text="Renewable energy sources like solar, wind, and hydroelectric power are sustainable alternatives to fossil fuels.")
        return []

class ActionProvideDeforestationInfo(Action):
    def name(self) -> Text:
        return "action_provide_deforestation_info"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        dispatcher.utter_message(text="Deforestation is the clearing of forests for agriculture or urban development, leading to habitat loss and climate change.")
        return []