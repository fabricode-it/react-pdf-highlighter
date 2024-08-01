"use client";

import "../../src/style/Sidebar.css";

import React, { useEffect, useRef, useState } from "react";
import { faSpinnerThird } from "@fortawesome/pro-regular-svg-icons/faSpinnerThird";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { IHighlight, NewHighlight } from "./react-pdf-highlighter";
import {
  Highlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
  Tip,
} from "./react-pdf-highlighter";
import { Sidebar } from "./Sidebar";

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

const HighlightPopup = ({
  comment,
}: {
  comment: { text: string; emoji: string };
}) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/2312.10997";
const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480";

const PdfViewerComponent: React.FC = () => {
  const [url, setUrl] = useState("https://arxiv.org/pdf/2312.10997");
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const scrollToRef = useRef<(highlight: IHighlight) => void>();

  useEffect(() => {
    const handleHashChange = () => {
      scrollToHighlightFromHash();
    };

    window.addEventListener("hashchange", handleHashChange, false);

    return () => {
      window.removeEventListener("hashchange", handleHashChange, false);
    };
  }, [highlights, scrollToRef.current]);

  const resetHighlights = () => {
    setHighlights([]);
  };

  const toggleDocument = () => {
    const newUrl =
      url === PRIMARY_PDF_URL ? SECONDARY_PDF_URL : PRIMARY_PDF_URL;
    setUrl(newUrl);
    setHighlights([]);
  };

  const scrollToHighlightFromHash = () => {
    const highlight = getHighlightById(parseIdFromHash());
    if (highlight && scrollToRef.current) {
      scrollToRef.current(highlight);
    }
  };

  const getHighlightById = (id: string) => {
    const foundHighlight = highlights.find((highlight) => highlight.id === id);
    return foundHighlight;
  };

  const addHighlight = (highlight: NewHighlight) => {
    setHighlights((prevHighlights) => [
      { ...highlight, id: getNextId() },
      ...prevHighlights,
    ]);
  };

  return (
    <div className="App" style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        highlights={highlights}
        resetHighlights={resetHighlights}
        toggleDocument={toggleDocument}
      />
      <div
        style={{
          height: "100vh",
          width: "75vw",
          position: "relative",
        }}
      >
        <PdfLoader
          url={url}
          beforeLoad={
            <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
          }
        >
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onScrollChange={resetHash}
              scrollRef={(scrollTo) => {
                scrollToRef.current = scrollTo;
                scrollToHighlightFromHash();
              }}
              onSelectionFinished={(
                position,
                content,
                hideTipAndSelection,
                transformSelection
              ) => (
                <Tip
                  onOpen={transformSelection}
                  onConfirm={(comment) => {
                    addHighlight({ content, position, comment });
                    hideTipAndSelection();
                  }}
                />
              )}
              highlightTransform={(
                highlight,
                index,
                setTip,
                hideTip,
                viewportToScaled,
                screenshot,
                isScrolledTo
              ) => {
                return (
                  <Popup
                    popupContent={<HighlightPopup {...highlight} />}
                    onMouseOver={(popupContent) =>
                      setTip(highlight, () => popupContent)
                    }
                    onMouseOut={hideTip}
                    key={index}
                  >
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  </Popup>
                );
              }}
              highlights={highlights}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
};

export default PdfViewerComponent;
