import React from "react";

const Pagination = (props) => {
  const { page, totalPages, onLeftClick, onRightClick, setPage } = props;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("...");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageClick = (pageNum) => {
    if (pageNum !== "..." && pageNum !== page && pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum - 1);
    }
  };

  return (
    <div className="pagination-container">
      <button onClick={onLeftClick} disabled={page === 1} className="pagination-arrow">
        ◀️
      </button>
      <div className="pagination-numbers">
        {getPageNumbers().map((pageNum, index) => (
          <button
            key={index}
            onClick={() => handlePageClick(pageNum)}
            className={`pagination-number ${pageNum === page ? "active" : ""} ${pageNum === "..." ? "ellipsis" : ""}`}
            disabled={pageNum === "..." || pageNum === page}
          >
            {pageNum}
          </button>
        ))}
      </div>
      <div className="pagination-info">
        {page} de {totalPages}
      </div>
      <button onClick={onRightClick} disabled={page === totalPages} className="pagination-arrow">
        ▶️
      </button>
    </div>
  );
};

export default Pagination;
