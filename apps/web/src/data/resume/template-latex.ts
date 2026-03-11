export const templateLatex = String.raw`\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage[usenames,dvipsnames]{color}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{etoolbox}
\input{glyphtounicode}

%----------PAGE STYLE----------
\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

%----------MARGINS----------
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

%----------SECTION FORMATTING----------
\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\pdfgentounicode=1

%----------CUSTOM COMMANDS----------

% \entry{title}{dates}{subtitle}{location}
%   - All blank    → bare \item for content-only sections (e.g. Technical Skills)
%   - No subtitle  → single-row project heading (\small)
%   - With subtitle → two-row subheading (bold title, italic subtitle)
\newcommand{\entry}[4]{%
  \ifboolexpr{
    test {\ifblank{#1}} and test {\ifblank{#2}}
    and test {\ifblank{#3}} and test {\ifblank{#4}}
  }{%
    \item\small%
  }{%
    \ifboolexpr{ test {\ifblank{#3}} and test {\ifblank{#4}} }{%
      \item
      \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
        \small\textbf{#1} & \small#2 \\
      \end{tabular*}\vspace{-7pt}%
    }{%
      \vspace{-2pt}\item
      \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
        \textbf{#1} & #2 \\
        \textit{\small#3} & \textit{\small #4} \\
      \end{tabular*}\vspace{-7pt}%
    }%
  }%
}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newenvironment{entrylist}{
  \begin{itemize}[leftmargin=0.15in, label={}]
}{
  \end{itemize}
}

\newenvironment{tightitemize}{
  \begin{itemize}[itemsep=-2pt, parsep=2pt]
  \small
}{
  \end{itemize}\vspace{-5pt}
}

%----------DOCUMENT----------
\begin{document}

\begin{center}
  \textbf{\Huge \scshape \field{name}} \\ \vspace{1pt}
  \small\inlinelist{contacts}{ $|$ }
\end{center}

\begin{group-list}{sections}
\section{\field{sectionTitle}}

\begin{entrylist}
\begin{group-list}{entries}

  \entry
    {\field{entryTitle}\begin{if}{tags}{\textnormal{ $|$ \emph{\inlinelist{tags}{, }}}}\end{if}}
    {\begin{if}{startDate}\field{startDate} -- \field{endDate}\end{if}}
    {\field{subtitle}}
    {\field{location}}

  \list{highlights}[bullet=tightitemize]

\end{group-list}
\end{entrylist}
\end{group-list}

\end{document}`;
