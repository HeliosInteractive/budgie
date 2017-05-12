'use strict';

let styleBlock = document.createElement('style');

styleBlock.innerHTML = `
.budgie-container {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center; }

.budgie-item :first-child {
  max-height: 100%;
  max-width: 100%; }

.budgie-container-parent {
  overflow: -moz-scrollbars-none; }
  .budgie-container-parent::-webkit-scrollbar {
    display: none; }
`;

document.head.appendChild(styleBlock);