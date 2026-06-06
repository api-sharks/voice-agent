self.whisper = {
  async loadModel() {
    return {
      async transcribe() {
        return {
          text: 'Mock transcript: my name is Waheed, my phone number is 9876543210, I am from Hyderabad'
        };
      }
    };
  }
};
