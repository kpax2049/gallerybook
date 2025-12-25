import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { TagField } from './tag-field';

function renderWithState(initial = ['one']) {
  function Wrapper() {
    const [value, setValue] = React.useState(initial);
    return <TagField value={value} onChange={setValue} />;
  }
  render(<Wrapper />);
}

describe('TagField', () => {
  it('adds unique trimmed tags and prevents duplicates', () => {
    renderWithState(['one']);

    const input = screen.getByPlaceholderText('Add a tag…');
    fireEvent.change(input, { target: { value: ' two ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('two')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'TWO' } });
    fireEvent.click(screen.getByText(/Add/i));

    // duplicate should not be added again
    expect(screen.getAllByText(/two/i)).toHaveLength(1);
  });

  it('removes tags when clicking the remove button', () => {
    renderWithState(['keep', 'drop']);

    const dropBadge = screen.getByText('drop').closest('div')!;
    const removeButton = dropBadge.querySelector('button[title="Remove"]')!;
    fireEvent.click(removeButton);

    expect(screen.queryByText('drop')).not.toBeInTheDocument();
    expect(screen.getByText('keep')).toBeInTheDocument();
  });
});
