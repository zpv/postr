import { useState } from "react";

const AboutModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  return <div>Test</div>;
};

export default AboutModal;
