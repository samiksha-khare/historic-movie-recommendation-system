import { Kafka } from 'kafkajs';

class KafkaProducer {
    constructor({ clientId, brokers }) {
        this.kafka = new Kafka({ clientId, brokers });
        this.producer = this.kafka.producer();
    }

    async connect() {
        await this.producer.connect();
    }

    async sendMessage(topic, message) {
        await this.producer.send({
            topic,
            messages: [
                { value: message },
            ],
        });
    }

    async disconnect() {
        await this.producer.disconnect();
    }

    async sendEvent(topic, message) {
        try {
            await this.connect();
            await this.sendMessage(topic, message);
            await this.disconnect();
        } catch (error) {
            console.error('Error sending Kafka event:', error);
        }
    }
}

export default KafkaProducer;
