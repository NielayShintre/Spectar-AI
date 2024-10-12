import React from "react";

type Props = { pdf_url: string };

const PDFViewer = ({ pdf_url }: Props) => {
  return (
    <iframe
      src={`https://docs.google.com/gview?url=${pdf_url}&embedded=true`}
      className="w-full h-full border-2 border-[#000000] border-dashed"
    ></iframe>
  );
};

export default PDFViewer;
