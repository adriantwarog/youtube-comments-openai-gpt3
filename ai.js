
import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
    organization: "org-i16GdI3biVetsydNnhzCYRLs",
    apiKey: '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',
});
const openai = new OpenAIApi(configuration);
const response = await openai.createCompletion({
	model: "text-davinci-003",
	prompt: "Say this is a test",
	max_tokens: 7,
	temperature: 0,
  });

console.log(response.data.choices[0].text);