My final-year project, SageSearch, lets you ask questions of a book and get answers in the voice of its central figure: Krishna for the Bhagavad Gita and Dr. APJ Abdul Kalam for *Wings of Fire*. Building it raised a question I could not answer from blog posts, so I measured it. Should the model retrieve a few relevant passages, or read the whole book every time? I presented the results at ICMCE 2026 in May. Here is what I found.

## Two ways to ground an answer

**Retrieval-augmented generation, RAG.** Split each book into chunks, embed them, and at question time fetch the few chunks closest to the question. SageSearch splits text into 1,000-character chunks with overlap, embeds them with `text-embedding-3-small`, stores them in Pinecone and sends the top 3 to the model.

**Cache-augmented generation, CAG.** Skip retrieval and put the entire book into the prompt. With a 128K-token context window, both books fit.

Both pipelines used `gpt-4o-mini` and the same persona prompts, so the only difference was how the context was built.

| Book | Words | Chunks |
| --- | --- | --- |
| Bhagavad Gita | 19,646 | 155 |
| Wings of Fire | 54,594 | 414 |

## How I scored them

I generated a test set of 30 questions, 15 per book, and ran each question through both pipelines. A separate model call acted as judge and scored every answer from 0 to 1 on three things:

- **Faithfulness.** Does the answer stick to the source text?
- **Correctness.** Does it match the reference answer?
- **Relevance.** Does it address the question that was asked?

I also logged latency and token counts for every call.

## Results

| Metric | RAG | CAG |
| --- | --- | --- |
| Faithfulness | 93.33% | 87.67% |
| Correctness | 90.00% | 75.33% |
| Relevance | 96.67% | 100.00% |
| Average latency | 6.3 s | 13.6 s |
| Prompt tokens per answer | 806 | 53,033 |
| Total tokens, all 30 questions | 30,759 | 1,599,036 |

RAG was more faithful and more correct, answered in under half the time, and used 52 times fewer tokens per answer. CAG won on one metric. Every one of its answers addressed the question.

The gap grew with the size of the book. On the Gita, both pipelines scored the same 93.33% on faithfulness. On *Wings of Fire*, which is almost three times longer, CAG's correctness dropped to 71.33% against RAG's 91.33%.

## Where each one failed

CAG scored zero on three questions even though the answer was somewhere in the 227,000 characters it had been given. Having the whole book in context did not guarantee the model used the right passage.

RAG's one complete miss was a question about a ten-year profile in *Wings of Fire*. The three retrieved chunks did not contain the answer, so the model had nothing to work with, while CAG got half marks on it. That is RAG's failure mode in one example. When retrieval misses, the answer is off topic.

## Why SageSearch uses CAG anyway

SageSearch is a conversation with a persona, not a lookup tool. The deciding factors were relevance and completeness. An answer that draws on the whole book and always addresses the question mattered more here than token cost, and CAG never went off topic. The books are fixed and small, so the cost of sending the whole text is predictable.

For many products the numbers point the other way. If the corpus grows, changes often, or the bill matters, RAG's 52x token saving and faster answers win.

## When each one fits

- **Choose RAG** for large or changing document sets, cost-sensitive products and questions with one right passage.
- **Choose CAG** for a small, fixed corpus where every answer must stay on topic and you can afford the tokens.
- **Measure before you choose.** It is easy to assume CAG wins on quality because it sees everything. On these two books it did not.

## Caveats

Thirty questions is a small test set, the judge was itself a language model, and I tested one model on two books. Treat these numbers as a direction, not a law. The evaluation scripts and the raw per-question scores are part of the project, so the comparison can be rerun on other books.
