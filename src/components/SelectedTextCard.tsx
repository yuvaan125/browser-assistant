interface SelectedTextCardProps {
  text: string;
}

function SelectedTextCard({ text }: SelectedTextCardProps) {
  return (
    <div>
      <h2>Selected Text</h2>

      {text ? (
        <p>{text}</p>
      ) : (
        <p>
          <em>No text selected.</em>
        </p>
      )}
    </div>
  );
}

export default SelectedTextCard;