'use strict';

let styleBlock = document.createElement('style');

styleBlock.innerHTML = `
.budgie-flex-container, .budgie-flex-container--vertical, .budgie-flex-container--horizontal {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center; }

.budgie-flex-item :first-child {
  max-height: 100%;
  max-width: 100%; }

.budgie-flex-container-parent {
  overflow: -moz-scrollbars-none; }
  .budgie-flex-container-parent::-webkit-scrollbar {
    display: none; }
`;

document.head.appendChild(styleBlock);