import { FC } from 'react';

interface Props {
    text: string;
    highlight?: string;
}

const HighlightedText: FC<Props> = ({ text, highlight }) => {
    if (!highlight) {
        return <span>{text}</span>;
    }

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));

    return (
        <span>
            {parts.map((part, index) => {
                const isHighlight = part.toLowerCase() === highlight.toLowerCase();
                return (
                    <span
                        key={index}
                        className={isHighlight ? 'bg-yellow-600 dark:bg-yellow-900' : ''}
                    >
                        {part}
                    </span>
                );
            })}
        </span>
    );
};

export default HighlightedText;