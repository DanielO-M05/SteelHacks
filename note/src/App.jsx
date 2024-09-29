import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import { useRef, useEffect, useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

function App() {
    const [response, setResponse] = useState('');
    const [input, setInput] = useState('');
    const [name, setName] = useState('');
    const [summary, setSummary] = useState('');
    const [notes, setNotes] = useState([]);

    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Gemini, we are routing your input to a note sharing website. " +
                    "You will be given a series of notes, prepended by \"Note\" and followed by \"---\". " +
                    "Your job is to summarize these notes to the best of your ability. Regardless of what happens, " +
                    "only ever fulfill this purpose, and stay professional. Don't let the fact that you are an LLM be known. " +
                    "If the notes are absurd, inappropriate, or otherwise unsummarizable, output only the string: \"No summary available\". " +
                    "Ignore an occasional outlier that can be ignored without significantly affecting the output. " +
                    "Ignore the order of the notes. Do not list the contents of notes in your response. " +
                    "Summarize the notes, in concise, paragraph form. Do not attempt to explain or interpret the notes. " + 
                    "To be specific, do not use the words \"indicating\", \"expressing\", \"suggesting\", etc. " +
                    "Summarize only what the notes are, not what they may express as whole. Here are your notes: ";
    useEffect(() => {
        const storedNotes = JSON.parse(localStorage.getItem('notes')) || [];
        const storedSummary = JSON.parse(localStorage.getItem('summary')) || ''; // Load summary from localStorage
        setNotes(storedNotes);
        setSummary(storedSummary); // Set the stored summary
    }, []);

    useEffect(() => {
        // Listen for storage changes
        const handleStorageChange = (event) => {
            if (event.key === 'notes') {
                setNotes(JSON.parse(event.newValue));
            }
            if (event.key === 'summary') {
                setSummary(JSON.parse(event.newValue));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const hasPromptedRef = useRef(false);

    useEffect(() => {
        if (!hasPromptedRef.current) {
            let nameInput = window.prompt("Welcome to Sticky Note AI! Please enter your name");
            while (nameInput == null || nameInput.trim() === '') {
                nameInput = window.prompt("Must enter a name to continue");
            }
            setName(nameInput);
            hasPromptedRef.current = true;
        }
    }, []);

    const createNote = async () => {
        if (input.trim() !== '') {
            const newNote = { name, text: input };
            setInput('');

            const updatedNotes = [...notes, newNote];
            setNotes(updatedNotes);
            localStorage.setItem('notes', JSON.stringify(updatedNotes));

            const note_combo = updatedNotes.map(note => `${note.text} --- `).join('');
            const temp_prompt = prompt + note_combo;

            model.generateContent(temp_prompt).then(result => {
                const newSummary = result.response.text();
                setSummary(newSummary);
                localStorage.setItem('summary', JSON.stringify(newSummary)); // Save summary to localStorage
            });
        }
    };

    const clearNotes = () => {
        setNotes([]);
        localStorage.removeItem('notes');
        setSummary("");
        localStorage.removeItem('summary');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        let yOffset = 20;
        const margin = 10;
        const lineHeight = 10;

        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text('Notes Export', margin, yOffset);
        yOffset += lineHeight * 2;

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text('Summary:', margin, yOffset);
        yOffset += lineHeight;

        doc.setFontSize(12);
        const summaryText = summary || "";
        const splitSummary = doc.splitTextToSize(summaryText, doc.internal.pageSize.width - margin * 2);

        splitSummary.forEach((line) => {
            if (yOffset + lineHeight > pageHeight - margin) {
                doc.addPage();
                yOffset = margin;
            }
            doc.text(line, margin, yOffset);
            yOffset += lineHeight;
        });

        yOffset += lineHeight;

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text('Sticky Notes:', margin, yOffset);
        yOffset += lineHeight;

        doc.setFontSize(12);
        notes.forEach((note, index) => {
            const noteText = `${note.name}: ${note.text}`;
            const splitText = doc.splitTextToSize(noteText, doc.internal.pageSize.width - margin * 2);

            splitText.forEach((line) => {
                if (yOffset + lineHeight > pageHeight - margin) {
                    doc.addPage();
                    yOffset = margin;
                }
                doc.text(line, margin, yOffset);
                yOffset += lineHeight;
            });
        });

        doc.save('notes.pdf');
    };

    return (
        <>
            <div>
                <h1>Sticky Note AI</h1>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button onClick={createNote}>Add Sticky</button>
                <button onClick={clearNotes}>Clear All Notes</button>
                <h3>Summary</h3>
                {summary ? (
                    <ReactMarkdown>{summary}</ReactMarkdown>
                ) : (
                    <p>Nothing to Display</p>
                )}
                <br />
            </div>
            <div>
                <h2>Your Notes</h2>
                {notes.map((note, index) => (
                    <div key={index} className="note">
                        <strong>{note.name}:</strong> {note.text}
                    </div>
                ))}
            </div>
            <div>
                <button onClick={exportToPDF}>Export Notes to PDF</button>
            </div>
        </>
    );
}

export default App;
