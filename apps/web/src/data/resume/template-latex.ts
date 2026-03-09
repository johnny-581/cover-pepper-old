export const templateLatex = String.raw`\documentclass{resume}

\name{\field{name}}
\contact{\begin{each}{contacts}\field{contact}\end{each}}

\begin{each}{sections}
\section{\field{sectionTitle}}

\begin{each}{entries}
  \entry{\field{entryTitle}}{\field{subtitle}}{\field{startDate} -- \field{endDate}}

  \begin{if}{location}
    \location{\field{location}}
  \end{if}

  \begin{if}{tags}
    \begin{each}{tags}
    \tag{\field{tag}}
    \end{each}
  \end{if}

  \begin{if}{highlights}
  \begin{itemize}
  \begin{each}{highlights}
    \item \field{highlight}
  \end{each}
  \end{itemize}
  \end{if}

\end{each}
\end{each}`;
